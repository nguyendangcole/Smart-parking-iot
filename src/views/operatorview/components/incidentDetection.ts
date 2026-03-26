import type { Incident, IncidentType } from './IncidentAlerts';

/**
 * Detect incidents from vehicle session data
 * This function analyzes parking data to identify problems
 */
export async function detectIncidents(): Promise<Incident[]> {
  const incidents: Incident[] = [];

  try {
    // TODO: Replace with real API calls when backend is ready
    // Example: const { data: sessions } = await supabase.from('vehicle_sessions').select('*').eq('status', 'active')

    // For now, return empty array
    // In production, this would:
    // 1. Check for duplicate entries (same plate entered twice)
    // 2. Check for unpaid exit attempts
    // 3. Check for sensor mismatches (entry recorded but no slot updated)
    // 4. Check for communication loss (gates offline)

    return incidents;
  } catch (error) {
    console.error('Error detecting incidents:', error);
    return incidents;
  }
}

/**
 * Check for specific incident types
 */
export async function checkDuplicateEntries(): Promise<Incident[]> {
  // Query vehicles that entered twice without exiting
  // SELECT plate FROM vehicle_sessions 
  // WHERE status = 'active' 
  // GROUP BY plate HAVING COUNT(*) > 1
  return [];
}

export async function checkUnpaidExits(): Promise<Incident[]> {
  // Query vehicles with pending payments trying to exit
  // SELECT vs.* FROM vehicle_sessions vs
  // JOIN charges c ON vs.id = c.session_id
  // WHERE c.paid = false AND vs.status = 'attempting_exit'
  return [];
}

export async function checkSensorMismatches(): Promise<Incident[]> {
  // Query slots where occupancy was recorded but no vehicle found
  // SELECT * FROM parking_slots WHERE last_sensor_update > now() - interval '5 min'
  // AND is_occupied = true AND occupancy_confidence < 0.5
  return [];
}

export async function checkGateHeartbeat(): Promise<Incident[]> {
  // Query gates that haven't sent heartbeat recently
  // SELECT * FROM io_gateways WHERE last_heartbeat < now() - interval '2 min'
  return [];
}
