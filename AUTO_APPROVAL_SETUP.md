# Auto-Approval Setup Instructions

## Environment Variable Configuration

To enable/disable auto-approval, set the following environment variable:

### For Development:
```bash
export AUTO_APPROVE_REGISTRATIONS=true
```

### For Production:
```bash
export AUTO_APPROVE_REGISTRATIONS=false
```

### Or create a .env file:
```env
AUTO_APPROVE_REGISTRATIONS=true
```

## How It Works

### When AUTO_APPROVE_REGISTRATIONS=true:
- User submits registration form
- System creates pending recruit record
- System immediately calls `approvePendingRecruit` with:
  - `packageAmount: "0.00"`
  - `kycDecision: { status: 'pending' }`
- User account is created instantly
- User receives success message with login details
- KYC documents are marked as 'pending'
- User can log in immediately

### When AUTO_APPROVE_REGISTRATIONS=false (default):
- User submits registration form
- System creates pending recruit record
- System returns "awaiting approval" message
- Admin must manually approve via admin dashboard

## Testing

1. Set `AUTO_APPROVE_REGISTRATIONS=true`
2. Create a referral link
3. Fill out the registration form
4. Submit the form
5. Verify user account is created immediately
6. Verify package amount is 0
7. Verify KYC status is pending
8. Verify user can log in

## Fallback Safety

If auto-approval fails for any reason, the system automatically falls back to manual approval mode.
