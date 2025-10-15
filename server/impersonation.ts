// Shared impersonation token management
export const impersonationTokens: Map<string, { 
  userId: string; 
  expiresAt: number; 
  jti: string; 
  issuedByAdminId?: string 
}> = new Map();

export const impersonationCodes: Map<string, { 
  userId: string; 
  expiresAt: number; 
  used: boolean; 
  jti: string; 
  issuedByAdminId: string 
}> = new Map();
