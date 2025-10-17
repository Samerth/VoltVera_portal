import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function BroadcastNotification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: async (data: { title: string; message: string }) => {
      const response = await apiRequest('POST', '/api/admin/notifications/broadcast', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Sent",
        description: `Notification sent to ${data.recipientCount} users successfully.`,
      });
      setIsDialogOpen(false);
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send broadcast notification",
        variant: "destructive",
      });
    },
  });

  const handleSendBroadcast = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({ title, message });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-broadcast-notification" className="gap-2">
          <Bell className="h-4 w-4" />
          Broadcast Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Broadcast Notification</DialogTitle>
          <DialogDescription>
            Send a notification to all active users in the system
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              data-testid="input-notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              data-testid="input-notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {message.length}/500 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            data-testid="button-cancel-broadcast"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendBroadcast}
            disabled={broadcastMutation.isPending}
            data-testid="button-send-broadcast"
            className="gap-2"
          >
            {broadcastMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to All Users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
