-- Consolida "Azúcar crudo NY No.11" (automatizado, ticker ICE SB=F vía Yahoo
-- Finance/CNBC) como única serie de crudo. La fila "Azúcar crudo" cargada
-- manualmente es el mismo commodity duplicado — se elimina para dejar una
-- sola pestaña de crudo en la página de precios.
delete from public.price_items
where label = 'Azúcar crudo';
