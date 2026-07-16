import { pool } from "@/infra/database";
import { QueryParam, getFilteredTicketsCTE } from "./base";

export interface VolumeStats {
  total: number;
  avgWait: string;
  avgService: string;
  efficiency: string;
}

/**
 * Obtém estatísticas gerais para um intervalo de datas
 */
export async function getVolumeStats(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<VolumeStats> {
  let baseFilter = "t.created_at BETWEEN $1 AND $2";
  const params: QueryParam[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const queryStr = `
    WITH ${getFilteredTicketsCTE(baseFilter)}
    SELECT 
      COUNT(*) as total,
      COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait_min,
      COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_service_min,
      COALESCE((COUNT(CASE WHEN effective_status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(CASE WHEN effective_status != 'no_show' THEN 1 END), 0), 0) as efficiency
    FROM filtered_tickets
  `;

  const { rows } = await pool.query(queryStr, params);

  const stats = rows[0];
  return {
    total: parseInt(stats.total, 10),
    avgWait: `${Math.round(parseFloat(stats.avg_wait_min))}min`,
    avgService: `${Math.round(parseFloat(stats.avg_service_min))}min`,
    efficiency: `${Math.round(parseFloat(stats.efficiency))}%`,
  };
}
