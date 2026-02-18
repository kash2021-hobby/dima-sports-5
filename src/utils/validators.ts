import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRequired(fields: string[], data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  fields.forEach((field) => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  });
  
  return errors;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateMPIN(mpin: string): boolean {
  return /^\d{4,6}$/.test(mpin);
}

export function validateDateOfBirth(dob: string | Date): boolean {
  const date = typeof dob === 'string' ? new Date(dob) : dob;
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  const minDate = new Date('1900-01-01');
  
  return date >= minDate && date <= today;
}

export function validationMiddleware(validator: (data: any) => ValidationError[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validator(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    
    next();
  };
}
