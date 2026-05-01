UPDATE "Setting"
SET value = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'valence' THEN elem
      WHEN idx % 2 = 1 THEN elem || '{"valence":"positive"}'::jsonb
      ELSE                    elem || '{"valence":"negative"}'::jsonb
    END
    ORDER BY idx
  )::text
  FROM jsonb_array_elements(value::jsonb) WITH ORDINALITY AS t(elem, idx)
)
WHERE key = 'panasItems';
