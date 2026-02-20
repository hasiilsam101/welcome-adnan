import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useHomepageSections, HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, EyeOff, Save, RotateCcw, ExternalLink,
  Layout, Megaphone, ShoppingBag, Star, Mail, Truck
} from "lucide-react";

const sectionIcons: Record<string, React.ElementType> = {
  hero: Layout,
  announcement: Megaphone,
  feature_bar: Truck,
  sale_banner: ShoppingBag,
  testimonials: Star,
  newsletter: Mail,
};

const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  announcement: "Announcement Bar",
  feature_bar: "Feature Bar (Trust Badges)",
  sale_banner: "Sale / Promo Banner",
  testimonials: "Testimonials",
  newsletter: "Newsletter Section",
};

function SectionEditor({ section, onSave, onToggle }: {
  section: HomepageSection;
  onSave: (id: string, updates: Partial<HomepageSection>) => Promise<boolean>;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: section.title || "",
    subtitle: section.subtitle || "",
    badge_text: section.badge_text || "",
    image_url: section.image_url || "",
    content: section.content || {},
  });
  const [saving, setSaving] = useState(false);

  const Icon = sectionIcons[section.section_type] || Layout;

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(section.id, {
      title: form.title || null,
      subtitle: form.subtitle || null,
      badge_text: form.badge_text || null,
      image_url: form.image_url || null,
      content: form.content,
    });
    if (success) setEditing(false);
    setSaving(false);
  };

  const handleReset = () => {
    setForm({
      title: section.title || "",
      subtitle: section.subtitle || "",
      badge_text: section.badge_text || "",
      image_url: section.image_url || "",
      content: section.content || {},
    });
    setEditing(false);
  };

  const updateContent = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      content: { ...prev.content, [key]: value }
    }));
  };

  return (
    <Card className={!section.is_enabled ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{sectionLabels[section.section_type] || section.section_type}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Sort Order: {section.sort_order}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={section.is_enabled ? "default" : "secondary"}>
            {section.is_enabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {section.is_enabled ? "Visible" : "Hidden"}
          </Badge>
          <Switch
            checked={section.is_enabled}
            onCheckedChange={(checked) => onToggle(section.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-2">
            {section.title && <p className="text-sm"><span className="font-medium">Title:</span> {section.title}</p>}
            {section.subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{section.subtitle}</p>}
            {section.badge_text && <Badge variant="outline">{section.badge_text}</Badge>}
            {section.image_url && (
              <div className="mt-2">
                <img src={section.image_url} alt="Section" className="h-20 w-auto rounded-lg object-cover" />
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
              Edit Section
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Badge Text</Label>
                <Input value={form.badge_text} onChange={(e) => setForm(prev => ({ ...prev, badge_text: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea value={form.subtitle} onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))} placeholder="https://..." />
              {form.image_url && <img src={form.image_url} alt="Preview" className="h-20 w-auto rounded-lg object-cover mt-1" />}
            </div>

            {/* Section-specific content fields */}
            {section.section_type === "hero" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={form.content.cta_text || ""} onChange={(e) => updateContent("cta_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input value={form.content.cta_link || ""} onChange={(e) => updateContent("cta_link", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text</Label>
                  <Input value={form.content.secondary_cta_text || ""} onChange={(e) => updateContent("secondary_cta_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Link</Label>
                  <Input value={form.content.secondary_cta_link || ""} onChange={(e) => updateContent("secondary_cta_link", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Highlight Text (colored word)</Label>
                  <Input value={form.content.highlight_text || ""} onChange={(e) => updateContent("highlight_text", e.target.value)} />
                </div>
              </div>
            )}

            {section.section_type === "announcement" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input value={form.content.link || ""} onChange={(e) => updateContent("link", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Link Text</Label>
                  <Input value={form.content.link_text || ""} onChange={(e) => updateContent("link_text", e.target.value)} />
                </div>
              </div>
            )}

            {section.section_type === "sale_banner" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={form.content.cta_text || ""} onChange={(e) => updateContent("cta_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input value={form.content.cta_link || ""} onChange={(e) => updateContent("cta_link", e.target.value)} />
                </div>
              </div>
            )}

            {section.section_type === "newsletter" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input value={form.content.button_text || ""} onChange={(e) => updateContent("button_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Placeholder Text</Label>
                  <Input value={form.content.placeholder || ""} onChange={(e) => updateContent("placeholder", e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomepageManager() {
  const { sections, loading, updateSection, toggleSection } = useHomepageSections();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Homepage Manager</h1>
            <p className="text-muted-foreground">Manage your store homepage content</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> View Store
            </a>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                onSave={updateSection}
                onToggle={toggleSection}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
