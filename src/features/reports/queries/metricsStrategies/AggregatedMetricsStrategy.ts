import { pool } from "@/infra/database";
import { QueryParam, ReportFiltersDTO, ChartPoint, EvolutionPoint, getFilteredTicketsCTE } from "../base";
import { MetricsStrategy } from "./MetricsStrategy";
import { VolumeStats } from "../volume";
import { CategoryRank, AttendantRank } from "../ranking";

export class AggregatedMetricsStrategy implements MetricsStrategy {
  async getVolumeStats(filters: ReportFiltersDTO): Promise<VolumeStats> {
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND date <= $${params.length}`;
    }

    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
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

  async getCategoryRanking(filters: ReportFiltersDTO): Promise<CategoryRank[]> {
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND m.date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND m.date <= $${params.length}`;
    }

    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND m.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND m.attendant = ANY($${params.length})`;
    }

    const finalQuery = `
      WITH total_tickets AS (SELECT COALESCE(SUM(total_generated), 0) as total FROM daily_ticket_metrics m WHERE ${baseFilter})
      SELECT 
        c.name,
        SUM(m.total_generated) as count,
        COALESCE((SUM(m.total_generated) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
      FROM daily_ticket_metrics m
      JOIN categories c ON m.category_id = c.id
      WHERE ${baseFilter}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 4
    `;

    const { rows } = await pool.query(finalQuery, params);
    return rows.map((row) => ({
      name: row.name,
      count: parseInt(row.count, 10),
      value: Math.round(parseFloat(row.percentage)),
    }));
  }

  async getAttendantRanking(filters: ReportFiltersDTO): Promise<AttendantRank[]> {
    let baseFilter = "m.attendant != 'Não Atribuído'";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND m.date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND m.date <= $${params.length}`;
    }

    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND m.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND m.attendant = ANY($${params.length})`;
    }

    const queryStr = `
      SELECT 
        m.attendant as name,
        SUM(m.total_completed) as count,
        COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration
      FROM daily_ticket_metrics m
      WHERE ${baseFilter}
      GROUP BY m.attendant
      ORDER BY count DESC
    `;

    const { rows } = await pool.query(queryStr, params);
    return rows.map((row) => ({
      name: row.name,
      count: parseInt(row.count, 10),
      avgDuration: Math.round(parseFloat(row.avg_duration)),
      rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
    }));
  }

  async getCategoryAvgDuration(filters: ReportFiltersDTO): Promise<ChartPoint[]> {
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND m.date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND m.date <= $${params.length}`;
    }

    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND m.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND m.attendant = ANY($${params.length})`;
    }

    const queryStr = `
      SELECT 
        c.name,
        COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration
      FROM daily_ticket_metrics m
      JOIN categories c ON m.category_id = c.id
      WHERE ${baseFilter}
      GROUP BY c.name
      ORDER BY avg_duration DESC
      LIMIT 5
    `;

    const { rows } = await pool.query(queryStr, params);
    return rows.map((row) => ({
      name: row.name || 'Desconhecido',
      value: Math.round(parseFloat(row.avg_duration)),
    }));
  }

  async getEvolutionSeries(filters: ReportFiltersDTO): Promise<EvolutionPoint[]> {
    const diffDays = (filters.startDate && filters.endDate) ? Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 3600 * 24)) : 999;
    
    if (diffDays <= 2) {
      let baseFilter = "1=1";
      const params: QueryParam[] = [];

      if (filters.startDate && filters.endDate) {
        params.push(filters.startDate, filters.endDate);
        baseFilter += ` AND t.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
      } else if (filters.startDate) {
        params.push(filters.startDate);
        baseFilter += ` AND t.created_at >= $${params.length}`;
      } else if (filters.endDate) {
        params.push(filters.endDate);
        baseFilter += ` AND t.created_at <= $${params.length}`;
      }

      if (filters.service && filters.service !== "all") {
        params.push(parseInt(filters.service, 10));
        baseFilter += ` AND t.category_id = $${params.length}`;
      }
      if (filters.locationId !== "all") {
        params.push(filters.locationId);
        baseFilter += ` AND t.location_id = $${params.length}`;
      }
      if (filters.attendants && filters.attendants.length > 0) {
        params.push(filters.attendants);
        baseFilter += ` AND t.attendant = ANY($${params.length})`;
      }

      const queryStr = `
        WITH ${getFilteredTicketsCTE(baseFilter)}
        SELECT 
          to_char(date_trunc('hour', original_created_at), 'HH24:MI') as time_label,
          COUNT(id) as total_count,
          COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_duration,
          COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
        FROM filtered_tickets
        GROUP BY date_trunc('hour', original_created_at)
        ORDER BY date_trunc('hour', original_created_at)
      `;

      const { rows } = await pool.query(queryStr, params);
      return rows.map((row) => ({
        time: row.time_label,
        total: parseInt(row.total_count, 10),
        avg: Math.round(parseFloat(row.avg_duration)),
        wait: Math.round(parseFloat(row.avg_wait)),
      }));
    }

    let groupBy = "date_trunc('day', m.date)";
    let dateFormat = "DD/MM";

    if (diffDays > 365) {
      groupBy = "date_trunc('month', m.date)";
      dateFormat = "MM/YYYY";
    } else if (diffDays > 90) {
      groupBy = "date_trunc('week', m.date)";
      dateFormat = "DD/MM";
    }

    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND m.date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND m.date <= $${params.length}`;
    }

    if (filters.service && filters.service !== "all") {
      params.push(parseInt(filters.service, 10));
      baseFilter += ` AND m.category_id = $${params.length}`;
    }
    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND m.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND m.attendant = ANY($${params.length})`;
    }

    const queryStr = `
      SELECT 
        to_char(${groupBy}, '${dateFormat}') as time_label,
        SUM(m.total_generated) as total_count,
        COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration,
        COALESCE(SUM(m.sum_wait_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_wait
      FROM daily_ticket_metrics m
      WHERE ${baseFilter}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `;

    const { rows } = await pool.query(queryStr, params);
    return rows.map((row) => ({
      time: row.time_label,
      total: parseInt(row.total_count, 10),
      avg: Math.round(parseFloat(row.avg_duration)),
      wait: Math.round(parseFloat(row.avg_wait)),
    }));
  }

  async getPeakHours(filters: ReportFiltersDTO): Promise<EvolutionPoint[]> {
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND t.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND t.created_at >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND t.created_at <= $${params.length}`;
    }

    if (filters.service && filters.service !== "all") {
      params.push(parseInt(filters.service, 10));
      baseFilter += ` AND t.category_id = $${params.length}`;
    }
    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND t.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND t.attendant = ANY($${params.length})`;
    }

    const queryStr = `
      WITH ${getFilteredTicketsCTE(baseFilter)}
      SELECT 
        LPAD(EXTRACT(HOUR FROM original_created_at)::text, 2, '0') || ':00' as time_label,
        COUNT(id) as total_count,
        COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
      FROM filtered_tickets
      GROUP BY EXTRACT(HOUR FROM original_created_at)
      ORDER BY EXTRACT(HOUR FROM original_created_at)
    `;

    const { rows } = await pool.query(queryStr, params);
    return rows.map((row) => ({
      time: row.time_label,
      total: parseInt(row.total_count, 10),
      avg: 0,
      wait: Math.round(parseFloat(row.avg_wait)),
    }));
  }

  async getBusyDays(filters: ReportFiltersDTO): Promise<ChartPoint[]> {
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND m.date >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND m.date <= $${params.length}`;
    }

    if (filters.service && filters.service !== "all") {
      params.push(parseInt(filters.service, 10));
      baseFilter += ` AND m.category_id = $${params.length}`;
    }
    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND m.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND m.attendant = ANY($${params.length})`;
    }

    const queryStr = `
      SELECT 
        EXTRACT(ISODOW FROM m.date) as dow,
        SUM(m.total_generated) as total_count
      FROM daily_ticket_metrics m
      WHERE ${baseFilter}
      GROUP BY EXTRACT(ISODOW FROM m.date)
      ORDER BY EXTRACT(ISODOW FROM m.date)
    `;

    const { rows } = await pool.query(queryStr, params);
    
    const map: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' };
    return rows.map((row) => ({
      name: map[parseInt(row.dow, 10)] || 'N/A',
      value: parseInt(row.total_count, 10),
    }));
  }
}
