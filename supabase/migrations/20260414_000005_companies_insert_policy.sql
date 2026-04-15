drop policy if exists companies_authenticated_insert on public.companies;
create policy companies_authenticated_insert
on public.companies
for insert
to authenticated
with check (true);
