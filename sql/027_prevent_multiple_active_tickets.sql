-- Create a unique partial index to prevent an attendant from having multiple active tickets on the same day
-- This completely eliminates race conditions where double clicks could assign two tickets to the same attendant simultaneously.

CREATE UNIQUE INDEX idx_unique_active_ticket_per_attendant 
ON tickets (attendant_id, (created_at::date)) 
WHERE status IN ('calling', 'started');
