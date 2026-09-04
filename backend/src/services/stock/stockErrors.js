/**
 * Base class for all stock-related business errors.
 * Carries a machine-readable `code` and HTTP `statusCode` so the
 * global error handler can map them cleanly to API responses.
 */
class StockError extends Error {
  /**
   * @param {string} message - Human-readable message
   * @param {string} code - Machine-readable code (e.g. INSUFFICIENT_STOCK)
   * @param {number} statusCode - HTTP status code
   * @param {object} [details] - Optional structured details
   */
  constructor(message, code, statusCode = 400, details = null) {
    super(message);
    this.name = 'StockError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Thrown when a stock issue/consumption is requested
 * but there is not enough physical stock available.
 */
class InsufficientStockError extends StockError {
  /**
   * @param {string} articleId
   * @param {number} requested
   * @param {number} available
   * @param {string} [locationName] - Optional specific location
   */
  constructor(articleId, requested, available, locationName = null) {
    const locInfo = locationName ? ` à l'emplacement ${locationName}` : '';
    super(
      `Stock insuffisant pour l'article ${articleId}${locInfo}. Demandé: ${requested}, Disponible: ${available}`,
      'INSUFFICIENT_STOCK',
      400,
      { articleId, requested, available, locationName }
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Thrown when a stock operation is structurally invalid
 * (e.g. negative quantity, unknown operation type).
 */
class InvalidStockOperationError extends StockError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = null) {
    super(message, 'INVALID_STOCK_OPERATION', 400, details);
    this.name = 'InvalidStockOperationError';
  }
}

/**
 * Thrown when a referenced stock location does not exist
 * or is invalid for the operation.
 */
class InvalidStockLocationError extends StockError {
  /**
   * @param {string} articleId
   * @param {string} locationName
   */
  constructor(articleId, locationName) {
    super(
      `Emplacement '${locationName}' introuvable pour l'article ${articleId}`,
      'INVALID_STOCK_LOCATION',
      400,
      { articleId, locationName }
    );
    this.name = 'InvalidStockLocationError';
  }
}

/**
 * Thrown when a commande is in a status that does not allow
 * the requested operation (e.g. already received).
 */
class InvalidCommandeStatusError extends StockError {
  /**
   * @param {number|string} commandeId
   * @param {string} currentStatus
   * @param {string} requiredStatus
   */
  constructor(commandeId, currentStatus, requiredStatus) {
    super(
      `Commande ${commandeId} a le statut '${currentStatus}', requis: '${requiredStatus}'`,
      'INVALID_COMMANDE_STATUS',
      400,
      { commandeId, currentStatus, requiredStatus }
    );
    this.name = 'InvalidCommandeStatusError';
  }
}

module.exports = {
  StockError,
  InsufficientStockError,
  InvalidStockOperationError,
  InvalidStockLocationError,
  InvalidCommandeStatusError,
};
