import { pool } from "@/infra/database";
import { QueryParam } from "./base";

export interface VolumeStats {
  total: number;
  avgWait: string;
  avgService: string;
  efficiency: string;
}

/**
 * Obtém estatísticas gerais para um intervalo de datas
 */
export async function getVolumeStats(startDate: Date | null, endDate: Date | null, locationId: number | "all", attendants: string[]): Promise<VolumeStats> {
  let baseFilter = "1=1";
  const params: QueryParam[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    baseFilter += ` AND date BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (startDate) {
    params.push(startDate);
    baseFilter += ` AND date >= $${params.length}`;
  } else if (endDate) {
    params.push(endDate);
    baseFilter += ` AND date <= $${params.length}`;
  }

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND attendant = ANY($${params.length})`;
  }

  const queryStr = `
    SELECT 
      COALESCE(SUM(total_generated), 0) as total,
      COALESCE(SUM(sum_wait_seconds) / NULLIF(SUM(total_completed), 0) / 60, 0) as avg_wait_min,
      COALESCE(SUM(sum_service_seconds) / NULLIF(SUM(total_completed), 0) / 60, 0) as avg_service_min,
      COALESCE((SUM(total_completed) * 100.0) / NULLIF((SUM(total_generated) - SUM(total_no_show)), 0), 0) as efficiency
    FROM daily_ticket_metrics
    WHERE ${baseFilter}
  `;

  const { rows } = await pool.query(queryStr, params);

  const stats = rows[0] || { total: 0, avg_wait_min: 0, avg_service_min: 0, efficiency: 0 };
  return {
    total: parseInt(stats.total, 10),
    avgWait: `${Math.round(parseFloat(stats.avg_wait_min))}min`,
    avgService: `${Math.round(parseFloat(stats.avg_service_min))}min`,
    efficiency: `${Math.round(parseFloat(stats.efficiency))}%`,
  };
}
