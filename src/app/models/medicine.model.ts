export interface Medicine {
  id?: string;
  name: string;
  dosage: number; // en mg
  quantity: number; // cantidad de tabletas
  expirationDate: Date | string; // fecha de caducidad
  barcodeData?: string; // datos del código de barras
  createdAt?: Date | string;
  updatedAt?: Date | string;
  userId?: string; // para sincronización con Supabase
}

export interface MedicineNotification {
  medicineId: string;
  medicineName: string;
  daysUntilExpiration: number;
  expirationDate: Date;
  notificationSent: boolean;
}
