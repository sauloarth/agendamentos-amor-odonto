const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const weekdayIndex = (name: string): number => {
  const index = WEEKDAYS.indexOf(name.trim().toLowerCase());
  if (index === -1) {
    throw new Error(`Unknown weekday "${name}"`);
  }
  return index;
};

/**
 * Parses human-friendly dates relative to now, in local time:
 *   "today at 10:00", "tomorrow at 10:00", "yesterday at 09:00",
 *   "in 5 days at 08:00", "next monday at 12:30"
 */
const parseRelativeDate = (text: string): Date => {
  const match = text.trim().match(/^(.+?) at (\d{2}):(\d{2})$/i);
  if (!match) {
    throw new Error(`Unsupported date "${text}". Expected "<day> at HH:mm"`);
  }

  const [, day, hours, minutes] = match;
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const dayText = day.toLowerCase();
  const inDays = dayText.match(/^in (\d+) days?$/);
  const nextWeekday = dayText.match(/^next (\w+)$/);

  if (dayText === 'today') {
    // keep date
  } else if (dayText === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  } else if (dayText === 'yesterday') {
    date.setDate(date.getDate() - 1);
  } else if (inDays) {
    date.setDate(date.getDate() + Number(inDays[1]));
  } else if (nextWeekday) {
    const diff = (weekdayIndex(nextWeekday[1]) - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + diff);
  } else {
    throw new Error(`Unsupported day "${day}" in date "${text}"`);
  }

  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

export { parseRelativeDate, weekdayIndex };
