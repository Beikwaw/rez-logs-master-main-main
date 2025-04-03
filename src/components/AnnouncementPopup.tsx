import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import type { Announcement } from "@/types/announcement";
import { markAnnouncementAsShown } from "@/lib/firestore";
import { useEffect } from "react";

interface AnnouncementPopupProps {
  announcement: Announcement;
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementPopup({ announcement, isOpen, onClose }: AnnouncementPopupProps) {
  useEffect(() => {
    if (isOpen && announcement && !announcement.isFirstTimeShown) {
      markAnnouncementAsShown(announcement.id).catch(console.error);
    }
  }, [isOpen, announcement]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${
              announcement.priority === 'high' ? 'bg-red-500' :
              announcement.priority === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />
            {announcement.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Posted by {announcement.createdByName} on{' '}
            {format(announcement.createdAt, 'PPP')}
            {announcement.expiresAt && (
              <span className="ml-2">
                • Expires: {format(announcement.expiresAt, 'PPP')}
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap">{announcement.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 