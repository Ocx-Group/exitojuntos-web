export interface UserData {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  identification: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageProfileUrl: string;
  birtDate: string;
  father: any;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
  };
}
