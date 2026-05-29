/**
 * DTO para actualizar el perfil del usuario
 */
export interface UpdateProfileDto {
  name?: string;
  username?: string;
  lastName?: string;
  identification?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  imageProfileUrl?: string;
  birtDate?: Date;
  father?: number;
  side?: number;
  status?: boolean;
  termsConditions?: boolean;
  countryId?: number;
}
