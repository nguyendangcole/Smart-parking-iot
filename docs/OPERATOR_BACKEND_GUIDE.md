# Operator View Backend Integration Guide

## Overview

Operator view has been enhanced with full backend functionality including database operations, real-time data fetching, and comprehensive API services.

## Database Schema

### Core Tables

1. **`gates`** - Gate information and status
   - Gate metadata (name, zone, type)
   - Real-time status monitoring
   - IP addresses and camera URLs

2. **`gate_actions`** - Gate operation history
   - All gate actions (open, close, lock, unlock)
   - Operator tracking and supervision
   - Action timestamps and reasons

3. **`operator_notifications`** - Notification system
   - Real-time alerts for operators
   - Different notification types (alert, incident, info)
   - Read/dismiss status tracking

4. **`incidents`** - Incident management
   - Security and operational incidents
   - Severity levels and status tracking
   - Resolution workflow

5. **`manual_handling_requests`** - Manual operations
   - Lost card reports
   - Manual entry/exit requests
   - Supervisor approval workflow

6. **`visitor_tickets`** - Visitor parking management
   - Ticket generation and tracking
   - Fee calculation and payment processing
   - Entry/exit time management

## Setup Instructions

### 1. Database Setup

Run the SQL scripts in order:

```bash
# 1. Create operator schema
psql -d your_database -f sql_scripts/operator_schema.sql

# 2. Insert mock data (optional, for testing)
psql -d your_database -f sql_scripts/operator_mock_data.sql
```

### 2. Frontend Integration

The operator functionality is already integrated into the frontend components. Key files:

- `src/shared/services/operatorService.ts` - Backend API service
- `src/shared/hooks/useOperatorData.ts` - React hook for data management
- `src/views/operatorview/components/` - Updated components with backend integration

### 3. Environment Variables

Ensure your `.env` file has the required Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Services

### OperatorService Class

The `operatorService` provides methods for all operator operations:

#### Dashboard Operations
```typescript
// Get dashboard KPIs
const kpis = await operatorService.getDashboardKPIs();

// Returns: {
//   totalSlots: number,
//   occupiedSlots: number,
//   zones: Array<{zone: string, total: number, occupied: number, occupancyRate: number}>,
//   activeIncidents: number,
//   todayActions: number
// }
```

#### Gate Management
```typescript
// Get all gates
const gates = await operatorService.getGates();

// Control gate (open/close/lock/unlock)
await operatorService.controlGate(gateId, 'open', operatorId, 'Reason');

// Get gate action history
const history = await operatorService.getGateActionsHistory(gateId);
```

#### Notifications
```typescript
// Get operator notifications
const notifications = await operatorService.getNotifications(operatorId);

// Mark notification as read
await operatorService.markNotificationAsRead(notificationId);

// Dismiss notification
await operatorService.dismissNotification(notificationId);
```

#### Manual Handling
```typescript
// Create manual handling request
const request = await operatorService.createManualHandlingRequest({
  operator_id: operatorId,
  request_type: 'lost_card',
  vehicle_plate: 'ABC-123',
  student_id: 'ST001',
  reason: 'Lost RFID card'
});

// Get manual handling requests
const requests = await operatorService.getManualHandlingRequests(operatorId);
```

#### Visitor Tickets
```typescript
// Search visitor tickets
const tickets = await operatorService.getVisitorTickets('active', 'search_query');

// Create visitor ticket
const ticket = await operatorService.createVisitorTicket({
  ticket_number: 'VISIT-001',
  vehicle_plate: 'VISITOR-001',
  vehicle_type: 'car',
  fee_amount: 30000
});

// Process payment
await operatorService.processVisitorPayment(ticketId, 30000);
```

## React Hook Integration

### useOperatorData Hook

Simplified data management for operator components:

```typescript
import { useOperatorData } from '../../../shared/hooks/useOperatorData';

function OperatorComponent() {
  const {
    kpis,
    gates,
    notifications,
    incidents,
    loading,
    error,
    controlGate,
    markNotificationAsRead,
    createManualRequest
  } = useOperatorData();

  // Auto-refreshes every 30 seconds
  // Handles loading states and errors
  // Provides all operator operations
}
```

## Component Integration

### Dashboard Component

- Real-time KPI data from backend
- Live notifications system
- Automatic data refresh

### GateControl Component

- Real-time gate status monitoring
- Gate control actions with logging
- Action history tracking

### ManualHandling Component

- Lost card processing
- Manual entry/exit requests
- Supervisor approval workflow

### TicketScanner Component

- Visitor ticket search and management
- Payment processing
- Real-time fee calculation

## Security & Permissions

### Row Level Security (RLS)

All operator tables have RLS policies:

- **Operators** can view and manage their own data
- **Admins** have full access to all operator data
- **Authenticated users** can view relevant public data

### Required Permissions

Operators need the following permissions:

```sql
-- Database permissions for operators
GRANT SELECT, INSERT, UPDATE ON public.gates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.gate_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.manual_handling_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visitor_tickets TO authenticated;
```

## Testing

### Mock Data

Use the provided mock data for testing:

```bash
# Load mock data
psql -d your_database -f sql_scripts/operator_mock_data.sql
```

This creates:
- 6 gates with different statuses
- Sample gate actions history
- Operator notifications
- Incidents with different severity levels
- Manual handling requests
- Visitor tickets
- Lost card records

### Test Scenarios

1. **Dashboard Testing**
   - Verify KPI data accuracy
   - Test notification system
   - Check real-time updates

2. **Gate Control Testing**
   - Test gate open/close operations
   - Verify action logging
   - Test status updates

3. **Manual Handling Testing**
   - Create lost card reports
   - Test manual entry/exit
   - Verify supervisor approval workflow

4. **Visitor Management Testing**
   - Create visitor tickets
   - Test payment processing
   - Verify fee calculations

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Check RLS policies
   - Verify operator role assignments
   - Ensure proper authentication

2. **Data Not Loading**
   - Check Supabase connection
   - Verify table existence
   - Check network connectivity

3. **Real-time Updates Not Working**
   - Verify auto-refresh intervals
   - Check WebSocket connections
   - Ensure proper error handling

### Debug Mode

Enable debug logging:

```typescript
// In operatorService.ts
console.log('Operator Service Debug:', data);
```

## Performance Considerations

- **Data Refresh**: Dashboard auto-refreshes every 30 seconds
- **Batch Operations**: Use Promise.all for parallel data fetching
- **Caching**: React hooks provide built-in caching
- **Pagination**: Large datasets use pagination for better performance

## Future Enhancements

1. **Real-time WebSocket Integration**
2. **Mobile App Support**
3. **Advanced Analytics Dashboard**
4. **Integration with IoT Devices**
5. **Automated Incident Detection**

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review database logs
3. Verify Supabase configuration
4. Contact development team
