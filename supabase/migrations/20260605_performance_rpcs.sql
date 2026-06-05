-- Performance RPC functions for analytics.ts fallback pattern
-- Each function is called via (supabase.rpc as any) with client-side fallback if not deployed

-- Monthly revenue bucketed by month (replaces client-side reduce in getMonthlyRevenue)
create or replace function get_monthly_revenue(p_company_id uuid, p_months integer default 6)
returns table (month text, revenue numeric, expenses numeric)
language sql stable
as $$
  with months as (
    select generate_series(
      date_trunc('month', now() - (p_months - 1) * interval '1 month'),
      date_trunc('month', now()),
      interval '1 month'
    ) as month_start
  ),
  sales_by_month as (
    select date_trunc('month', created_at) as m, coalesce(sum(grand_total), 0) as rev
    from sales
    where company_id = p_company_id
      and created_at >= date_trunc('month', now() - (p_months - 1) * interval '1 month')
    group by 1
  ),
  expenses_by_month as (
    select date_trunc('month', expense_date::timestamptz) as m, coalesce(sum(amount), 0) as exp
    from expenses
    where company_id = p_company_id
      and expense_date::timestamptz >= date_trunc('month', now() - (p_months - 1) * interval '1 month')
    group by 1
  )
  select
    to_char(months.month_start, 'Mon') as month,
    coalesce(s.rev, 0) as revenue,
    coalesce(e.exp, 0) as expenses
  from months
  left join sales_by_month s on s.m = months.month_start
  left join expenses_by_month e on e.m = months.month_start
  order by months.month_start;
$$;

-- Top products by quantity sold (replaces client-side GROUP BY in getTopProducts)
create or replace function get_top_products(
  p_company_id uuid,
  p_start timestamptz,
  p_limit integer default 5
)
returns table (product_id uuid, product_name text, total_quantity bigint, total_revenue numeric)
language sql stable
as $$
  select
    si.product_id,
    si.product_name,
    sum(si.quantity)::bigint as total_quantity,
    sum(si.line_total) as total_revenue
  from sale_items si
  join sales s on s.id = si.sale_id
  where s.company_id = p_company_id
    and s.created_at >= p_start
  group by si.product_id, si.product_name
  order by total_quantity desc
  limit p_limit;
$$;

-- Expense breakdown by category (replaces client-side GROUP BY in getExpenseBreakdown)
create or replace function get_expense_breakdown(
  p_company_id uuid,
  p_start text
)
returns table (category text, total numeric)
language sql stable
as $$
  select
    category,
    sum(amount) as total
  from expenses
  where company_id = p_company_id
    and expense_date >= p_start::date
  group by category
  order by total desc;
$$;

-- Operator activity stats (replaces unbounded activity_logs scan in getOperatorStats)
create or replace function get_operator_activity_stats(
  p_company_id uuid,
  p_days_back integer default 30
)
returns table (
  user_id uuid,
  full_name text,
  action_count bigint,
  last_active timestamptz
)
language sql stable
as $$
  select
    al.user_id,
    u.full_name,
    count(*)::bigint as action_count,
    max(al.created_at) as last_active
  from activity_logs al
  join users u on u.id = al.user_id
  where al.company_id = p_company_id
    and al.created_at >= now() - (p_days_back * interval '1 day')
  group by al.user_id, u.full_name
  order by action_count desc;
$$;
