export interface Role {
  id: number;
  name: string;
}

export interface Country {
  id?: number;
  name?: string;
}

export class UserAffiliate {
  id: number;
  name: string = '';
  lastName: string = '';
  password?: string;
  email: string = '';
  username: string = '';
  phone: string = '';
  googleId?: string;
  authProvider?: string;
  identification: string = '';
  address: string = '';
  city: string = '';
  state: string = '';
  zipCode?: string;
  father: number;
  side: number;
  status: boolean;
  imageProfileUrl: string = '';
  verificationCode?: string;
  termsConditions: boolean;
  birtDate: string = '';
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  role?: Role;
  roleId: number;
  countryId: number;
  country?: Country;
  access_token?: string;
}
