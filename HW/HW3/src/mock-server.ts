/**
 * Configuration options for initializing the mock flash sale backend server.
 */
export interface FlashSaleServerOptions {
  initialStock: number;
  saleStartsAt: number;
  reservationTtlMs: number;
  extensionMs: number;
  /**
   * Optional network failure rate between 0 and 1 (defaults to 0.1 for 10% failure).
   */
  networkFailureRate?: number;
}

/**
 * Result returned upon requesting a reservation.
 */
export type ReserveResult =
  | {
      ok: true;
      reservationId: string;
      expiresAt: number;
      stock: number;
    }
  | {
      ok: false;
      reason: 'SOLD_OUT' | 'ALREADY_RESERVED' | 'SALE_NOT_LIVE';
      stock: number;
    };

/**
 * Snapshot of current server-side stock and clock timestamps.
 */
export interface ServerSnapshot {
  stock: number;
  serverNow: number;
  saleStartsAt: number;
}

/**
 * Internal representation of an active stock reservation.
 */
interface ServerReservation {
  id: string;
  userId: string;
  expiresAt: number;
  extended: boolean;
}

/**
 * High-concurrency mock backend simulating a Vietnam flash-sale e-commerce engine.
 *
 * Concurrency & Invariant Rules:
 * 1. Simulates realistic network latency (300ms - 800ms) with a ~10% random transport failure rate.
 * 2. Atomic Reservation: Stock checking and decrementing happen strictly in the same synchronous block
 *    without any intervening await, preventing overselling under heavy concurrency.
 * 3. User Lease Constraint: Exactly one active reservation allowed per userId at any given time.
 * 4. Automatic Sweeping: Expired reservations are swept before operations, returning stock to the pool.
 * 5. Bot Traffic Simulation: Simulates competitor buyer activity decrementing inventory every 800-2000ms.
 */
export class FlashSaleServer {
  private stock: number;
  private readonly saleStartsAt: number;
  private readonly reservationTtlMs: number;
  private readonly extensionMs: number;
  private readonly networkFailureRate: number;

  private readonly reservations = new Map<string, ServerReservation>();
  private readonly userReservations = new Map<string, string>(); // userId -> reservationId
  private readonly listeners = new Set<(stock: number) => void>();

  private botTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isBotsRunning = false;

  constructor(options: FlashSaleServerOptions) {
    this.stock = Math.max(0, options.initialStock);
    this.saleStartsAt = options.saleStartsAt;
    this.reservationTtlMs = options.reservationTtlMs;
    this.extensionMs = options.extensionMs;
    this.networkFailureRate = options.networkFailureRate ?? 0.1;
  }

  /**
   * Simulates random network transport latency (300-800ms) and transport exceptions.
   */
  private async simulateNetwork(): Promise<void> {
    const latency = Math.floor(Math.random() * (800 - 300 + 1)) + 300;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, latency);
    });

    if (Math.random() < this.networkFailureRate) {
      throw new Error('Network unreachable. Please try again.');
    }
  }

  /**
   * Reclaims stock from reservations that have passed their expiration timestamp.
   * Runs synchronously to prevent race conditions during sweep.
   */
  private sweepExpired(): void {
    const now = Date.now();
    let reclaimed = 0;

    for (const [id, res] of this.reservations.entries()) {
      if (res.expiresAt <= now) {
        this.reservations.delete(id);
        this.userReservations.delete(res.userId);
        this.stock += 1;
        reclaimed++;
      }
    }

    if (reclaimed > 0) {
      this.notifySubscribers();
    }
  }

  /**
   * Dispatches current stock level to all registered subscribers.
   */
  private notifySubscribers(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.stock);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    }
  }

  /**
   * Fetches an authoritative server snapshot including synchronized clock epoch.
   */
  public async getSnapshot(): Promise<ServerSnapshot> {
    await this.simulateNetwork();
    this.sweepExpired();

    return {
      stock: this.stock,
      serverNow: Date.now(),
      saleStartsAt: this.saleStartsAt,
    };
  }

  /**
   * Attempts to atomically reserve a single stock unit for the specified user.
   *
   * Stock verification and decrement occur strictly within the same synchronous execution frame
   * AFTER network latency completes, guaranteeing zero overselling race conditions.
   *
   * @param userId - Unique identifier of the purchasing user
   */
  public async reserve(userId: string): Promise<ReserveResult> {
    await this.simulateNetwork();

    // --- ATOMIC SYNCHRONOUS TRANSACTION START (NO AWAIT) ---
    this.sweepExpired();
    const now = Date.now();

    if (now < this.saleStartsAt) {
      return {
        ok: false,
        reason: 'SALE_NOT_LIVE',
        stock: this.stock,
      };
    }

    if (this.userReservations.has(userId)) {
      return {
        ok: false,
        reason: 'ALREADY_RESERVED',
        stock: this.stock,
      };
    }

    if (this.stock <= 0) {
      return {
        ok: false,
        reason: 'SOLD_OUT',
        stock: 0,
      };
    }

    // Atomic decrement and lease registration
    this.stock -= 1;
    const reservationId = crypto.randomUUID();
    const expiresAt = now + this.reservationTtlMs;

    this.reservations.set(reservationId, {
      id: reservationId,
      userId,
      expiresAt,
      extended: false,
    });
    this.userReservations.set(userId, reservationId);

    this.notifySubscribers();

    return {
      ok: true,
      reservationId,
      expiresAt,
      stock: this.stock,
    };
    // --- ATOMIC SYNCHRONOUS TRANSACTION END ---
  }

  /**
   * Extends an active reservation expiration timestamp by the configured extension duration.
   * Each reservation may only be extended once.
   *
   * @param reservationId - Active reservation ID
   */
  public async extend(reservationId: string): Promise<{ expiresAt: number }> {
    await this.simulateNetwork();

    this.sweepExpired();
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      throw new Error('Reservation expired or not found.');
    }

    if (reservation.extended) {
      throw new Error('Reservation has already been extended once.');
    }

    reservation.extended = true;
    reservation.expiresAt += this.extensionMs;

    return {
      expiresAt: reservation.expiresAt,
    };
  }

  /**
   * Finalizes the purchase of a reserved item, permanently consuming the reserved stock unit.
   *
   * @param reservationId - Active reservation ID
   */
  public async checkout(reservationId: string): Promise<{ orderId: string }> {
    await this.simulateNetwork();

    this.sweepExpired();
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      throw new Error('Reservation expired or invalid.');
    }

    // Consume reservation without returning stock
    this.reservations.delete(reservationId);
    this.userReservations.delete(reservation.userId);

    const orderId = `ORD-VN-${crypto.randomUUID()}`;
    return { orderId };
  }

  /**
   * Subscribes a listener callback to real-time stock changes.
   *
   * @param listener - Callback receiving current stock count
   * @returns Unsubscribe teardown function
   */
  public subscribe(listener: (stock: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Starts background traffic bots simulating competing buyers purchasing inventory
   * every 800ms - 2000ms until inventory reaches 0.
   */
  public startBots(): void {
    if (this.isBotsRunning) {
      return;
    }
    this.isBotsRunning = true;

    const scheduleNextBot = (): void => {
      if (!this.isBotsRunning || this.stock <= 0) {
        this.stopBots();
        return;
      }

      const delay = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;
      this.botTimeoutId = setTimeout(() => {
        if (!this.isBotsRunning) {
          return;
        }

        this.sweepExpired();

        const now = Date.now();
        if (this.stock > 0 && now >= this.saleStartsAt) {
          // Simulated bot buyer buys one unit
          this.stock -= 1;
          this.notifySubscribers();
        }

        if (this.stock > 0 && this.isBotsRunning) {
          scheduleNextBot();
        } else {
          this.stopBots();
        }
      }, delay);
    };

    scheduleNextBot();
  }

  /**
   * Halts all automated bot background tasks and clears any pending timeout.
   */
  public stopBots(): void {
    this.isBotsRunning = false;
    if (this.botTimeoutId !== null) {
      clearTimeout(this.botTimeoutId);
      this.botTimeoutId = null;
    }
  }
}
