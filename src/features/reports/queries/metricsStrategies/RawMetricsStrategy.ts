import { pool } from "@/infra/database";
import { QueryParam, ReportFiltersDTO, ChartPoint, EvolutionPoint, getFilteredTicketsCTE, buildSubcategoryFilter } from "../base";
import { MetricsStrategy } from "./MetricsStrategy";
import { VolumeStats } from "../volume";
import { CategoryRank, AttendantRank } from "../ranking";

export class RawMetricsStrategy implements MetricsStrategy {
  private getBaseFilter(filters: ReportFiltersDTO, params: QueryParam[], tableAlias = 't'): string {
    let baseFilter = `(${tableAlias}.attendant_id IS NULL OR ${tableAlias}.attendant_id NOT IN (SELECT id FROM users WHERE role = 'Admin'))`;

    if (filters.startDate && filters.endDate) {
      params.push(filters.startDate, filters.endDate);
      baseFilter += ` AND ${tableAlias}.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (filters.startDate) {
      params.push(filters.startDate);
      baseFilter += ` AND ${tableAlias}.created_at >= $${params.length}`;
    } else if (filters.endDate) {
      params.push(filters.endDate);
      baseFilter += ` AND ${tableAlias}.created_at <= $${params.length}`;
    }

    if (filters.service && filters.service !== "all") {
      params.push(parseInt(filters.service, 10));
      baseFilter += ` AND ${tableAlias}.category_id = $${params.length}`;
    }
    if (filters.locationId !== "all") {
      params.push(filters.locationId);
      baseFilter += ` AND ${tableAlias}.location_id = $${params.length}`;
    }
    if (filters.attendants && filters.attendants.length > 0) {
      params.push(filters.attendants);
      baseFilter += ` AND u.name = ANY($${params.length})`;
    }
    if (filters.subcategories && filters.subcategories.length > 0) {
      params.push(filters.subcategories);
      baseFilter += ` AND ${buildSubcategoryFilter(params.length)}`;
    }
    
    return baseFilter;
  }

  async getVolumeStats(filters: ReportFiltersDTO): Promise<VolumeStats> {
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params);

    const queryStr = `
      WITH ${getFilteredTicketsCTE(baseFilter)}
      SELECT 
        COUNT(id) as total,
        COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait_min,
        COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_service_min,
        COALESCE((SUM(CASE WHEN effective_status = 'completed' THEN 1 ELSE 0 END) * 100.0) / 
                 NULLIF(SUM(CASE WHEN effective_status != 'no_show' THEN 1 ELSE 0 END), 0), 0) as efficiency
      FROM filtered_tickets
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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params, 't');

    const finalQuery = `
      WITH total_tickets AS (SELECT COUNT(id) as total FROM tickets t LEFT JOIN users u ON t.attendant_id = u.id WHERE ${baseFilter})
      SELECT 
        c.name,
        COUNT(t.id) as count,
        COALESCE((COUNT(t.id) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.attendant_id = u.id
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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params);

    const queryStr = `
      WITH ${getFilteredTicketsCTE(baseFilter)}
      SELECT 
        u.name as name,
        COUNT(f.id) as count,
        COALESCE(AVG(f.chain_service_seconds) / 60, 0) as avg_duration
      FROM filtered_tickets f
      LEFT JOIN users u ON f.attendant_id = u.id
      WHERE f.effective_status = 'completed' AND f.attendant_id IS NOT NULL
      GROUP BY u.name
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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params, 't');

    const queryStr = `
      WITH ${getFilteredTicketsCTE(baseFilter)}
      SELECT 
        c.name,
        COALESCE(AVG(f.chain_service_seconds) / 60, 0) as avg_duration
      FROM filtered_tickets f
      JOIN categories c ON f.category_id = c.id
      WHERE f.effective_status = 'completed'
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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params);

    const diffDays = (filters.startDate && filters.endDate) ? Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 3600 * 24)) : 999;
    
    let groupBy = "date_trunc('hour', original_created_at)";
    let selectLabel = "to_char(date_trunc('hour', original_created_at), 'HH24:MI')";
    
    if (diffDays > 2 && diffDays <= 90) {
      groupBy = "date_trunc('day', original_created_at)";
      selectLabel = "to_char(date_trunc('day', original_created_at), 'DD/MM')";
    } else if (diffDays > 90 && diffDays <= 365) {
      groupBy = "date_trunc('week', original_created_at)";
      selectLabel = "to_char(date_trunc('week', original_created_at), 'DD/MM')";
    } else if (diffDays > 365) {
      groupBy = "date_trunc('month', original_created_at)";
      selectLabel = "to_char(date_trunc('month', original_created_at), 'MM/YYYY')";
    }

    const queryStr = `
      WITH ${getFilteredTicketsCTE(baseFilter)}
      SELECT 
        ${selectLabel} as time_label,
        COUNT(id) as total_count,
        COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_duration,
        COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
      FROM filtered_tickets
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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params);

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
    const params: QueryParam[] = [];
    const baseFilter = this.getBaseFilter(filters, params, 't');

    const queryStr = `
      SELECT 
        EXTRACT(ISODOW FROM t.created_at) as dow,
        COUNT(t.id) as total_count
      FROM tickets t
      LEFT JOIN users u ON t.attendant_id = u.id
      WHERE ${baseFilter}
      GROUP BY EXTRACT(ISODOW FROM t.created_at)
      ORDER BY EXTRACT(ISODOW FROM t.created_at)
    `;

    const { rows } = await pool.query(queryStr, params);
    
    const map: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' };
    return rows.map((row) => ({
      name: map[parseInt(row.dow, 10)] || 'N/A',
      value: parseInt(row.total_count, 10),
    }));
  }
}
