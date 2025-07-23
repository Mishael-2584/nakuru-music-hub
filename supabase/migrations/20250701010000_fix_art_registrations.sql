-- Fix existing art registrations: set instrument to 'Art Classes' where missing or 'Not specified'
UPDATE registrations
SET instrument = 'Art Classes'
WHERE LOWER(course_category) = 'art'
  AND (instrument IS NULL OR instrument = '' OR instrument = 'Not specified'); 