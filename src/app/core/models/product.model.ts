/**
 * Representa un producto tal como lo devuelve el backend (ProductResponseDTO).
 */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  purchased: boolean;
  addedBy: string;
  createdAt: string;   // ISO string (LocalDateTime serializado por Jackson)
  modifiedBy: string | null;
  modifiedAt: string | null;
}

/**
 * Payload para crear o editar un producto (ProductRequestDTO).
 */
export interface ProductRequest {
  name: string;
  description?: string;
  quantity: number;
  userName: string;
}

/**
 * Payload para el endpoint de actualización rápida de cantidad (UpdateQuantityDTO).
 */
export interface UpdateQuantityRequest {
  quantity: number;
  userName: string;
}

/**
 * Forma del error que devuelve el GlobalExceptionHandler del backend.
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors: Record<string, string> | null;
}