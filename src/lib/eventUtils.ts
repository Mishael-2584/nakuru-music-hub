export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Normalize a DB date value to YYYY-MM-DD for date inputs and comparisons. */
export const normalizeEventDate = (dateStr: string) => dateStr.split("T")[0];

export const isEventUpcoming = (eventDate: string, today = getLocalDateString()) =>
  normalizeEventDate(eventDate) >= today;

export const isEventVisibleOnWebsite = (
  event: { status: string; event_date: string },
  today = getLocalDateString()
) => event.status === "published" && isEventUpcoming(event.event_date, today);

export const formatEventDate = (dateStr: string) => {
  const [year, month, day] = normalizeEventDate(dateStr).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatEventTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};
