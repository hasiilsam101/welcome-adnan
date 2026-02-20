import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { useCannedResponses, CannedResponse } from "@/hooks/useCannedResponses";

export function CannedResponsesSettings() {
  const { responses, isLoading, categories, addResponse, updateResponse, deleteResponse } = useCannedResponses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    shortcut: "",
    category: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setSelectedResponse(null);
    setFormData({ title: "", content: "", shortcut: "", category: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (response: CannedResponse) => {
    setSelectedResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      shortcut: response.shortcut || "",
      category: response.category || "",
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (response: CannedResponse) => {
    setSelectedResponse(response);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;

    setIsSaving(true);
    if (selectedResponse) {
      await updateResponse(selectedResponse.id, formData);
    } else {
      await addResponse(formData);
    }
    setIsSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedResponse) return;
    await deleteResponse(selectedResponse.id);
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quick Replies / Canned Responses
              </CardTitle>
              <CardDescription>
                Create pre-set messages for quick replies. Use shortcuts for fast insertion.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quick replies yet</p>
              <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
                Add your first one
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{response.title}</h4>
                          {response.shortcut && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {response.shortcut}
                            </Badge>
                          )}
                          {response.category && (
                            <Badge variant="outline" className="text-xs">
                              {response.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(response)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(response)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedResponse ? "Edit Quick Reply" : "New Quick Reply"}
            </DialogTitle>
            <DialogDescription>
              Create a pre-set message for quick responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Welcome message"
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shortcut (optional)</Label>
                <Input
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="/hello"
                />
                <p className="text-xs text-muted-foreground">
                  Start with /
                </p>
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="General"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title || !formData.content || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedResponse ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quick Reply?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedResponse?.title}" will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
