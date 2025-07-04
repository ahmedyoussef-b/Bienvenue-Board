// src/components/dashboard/admin/AdminSidebar.tsx
import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";

interface AdminSidebarProps {
  date: string | string[] | undefined;
}

const AdminSidebar = async ({ date }: AdminSidebarProps) => {
    return (
        <div className="lg:w-1/3 flex flex-col gap-6">
            <EventCalendarContainer date={date} />
            <div className="flex-1 min-h-0">
                <Announcements />
            </div>
        </div>
    );
};

export default AdminSidebar;
