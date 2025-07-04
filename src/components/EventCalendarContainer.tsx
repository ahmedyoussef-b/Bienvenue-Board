// src/components/EventCalendarContainer.tsx

import prisma from "@/lib/prisma";
import type { Event } from "@/types/index";
import EventCalendar from "./EventCalendar";
import Image from "next/image";

type EventCalendarContainerProps = {
  date?: string | string[] | undefined;
};

const EventCalendarContainer = async ({ date }: EventCalendarContainerProps) => {
  const selectedDateParam = Array.isArray(date) ? date[0] : date;
  const selectedDate = selectedDateParam ? new Date(selectedDateParam) : new Date();

  // 1. Fetch all event dates for highlighting
  const allEvents = await prisma.event.findMany({
    select: {
      startTime: true,
    },
  });
  const eventDates = allEvents.map(event => event.startTime.toISOString().split('T')[0]);
  const uniqueEventDates = [...new Set(eventDates)];

  // 2. Fetch events for the selected day
  const startOfDay = new Date(selectedDate);
  startOfDay.setUTCHours(0, 0, 0, 0); // Use UTCHours for consistency
  const endOfDay = new Date(selectedDate);
  endOfDay.setUTCHours(23, 59, 59, 999); // Use UTCHours for consistency
  
  const eventsForDay: Event[] = await prisma.event.findMany({
    where: {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
        startTime: 'asc'
    }
  });

  return (
    <div className="bg-muted p-4 rounded-md">
      <EventCalendar eventDates={uniqueEventDates} />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-semibold">Événements du jour</h1>
        <Image src="/moreDark.png" alt="plus d'options" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {eventsForDay.length > 0 ? (
          eventsForDay.map((event) => (
            <div
              className="p-3 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple bg-card"
              key={event.id}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{event.title}</h2>
                <span className="text-muted-foreground text-xs">
                  {new Date(event.startTime).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">{event.description}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">
            Aucun événement pour cette date.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventCalendarContainer;
