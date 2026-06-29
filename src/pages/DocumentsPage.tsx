import React, { useRef, useState } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { useAuth } from '@/contexts/AuthContext';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, Upload, Search, Download, Trash2, FolderOpen, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Ultrasound', 'Lab Results', 'Discharge', 'Care Notes', 'Consent', 'Medical Records'];
const MAX_BYTES = 10 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const {
    documents,
    loading,
    error,
    source,
    canUpload,
    canDelete,
    mothers,
    upload,
    downloadFile,
    remove,
    refetch,
  } = useDocuments(selectedPatientId || undefined);

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    patientId: '',
    category: 'Lab Results',
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  let docs = documents;
  if (category !== 'All') docs = docs.filter((d) => d.category === category);
  if (search) docs = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  if (sortBy === 'date') docs = [...docs].sort((a, b) => b.date.localeCompare(a.date));
  if (sortBy === 'name') docs = [...docs].sort((a, b) => a.name.localeCompare(b.name));

  const subtitle = user?.role === 'mother'
    ? 'Documents shared by your care team'
    : selectedPatientId
      ? mothers.find((m) => m.id === selectedPatientId)?.name ?? 'Select a mother'
      : 'All assigned mothers';

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = uploadForm.file;
    if (!file || !uploadForm.patientId) {
      toast.error('Select a mother and file to upload.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File exceeds 10 MB limit.');
      return;
    }
    setUploading(true);
    try {
      const contentBase64 = await fileToBase64(file);
      console.info("[documents] page upload", {
        patientId: uploadForm.patientId,
        fileName: file.name,
        bytes: file.size,
      });
      await upload({
        patientId: uploadForm.patientId,
        name: file.name,
        category: uploadForm.category,
        mimeType: file.type || 'application/octet-stream',
        contentBase64,
      });
      setSelectedPatientId(uploadForm.patientId);
      toast.success(`${file.name} uploaded`);
      setUploadOpen(false);
      setUploadForm({ patientId: '', category: 'Lab Results', file: null });
    } catch (err) {
      console.error('[documents] page upload failed:', err);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(id: string, name: string) {
    const toastId = toast.loading(`Downloading ${name}…`);
    try {
      await downloadFile(id, name);
      toast.success(`Downloaded ${name}`, { id: toastId });
    } catch (err) {
      console.error("[documents] download failed:", err);
      const message = err instanceof Error ? err.message : "Download failed";
      toast.error(message, { id: toastId });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await remove(id);
      toast.success('Document deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div data-tour="documents-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subtitle} · {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={source} loading={loading} />
          {canUpload && (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setUploadOpen(true)}>
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </Button>
          )}
        </div>
      </div>

      {canUpload && mothers.length > 0 && (
        <div className="max-w-xs">
          <Label className="text-xs text-muted-foreground mb-1 block">Filter by mother</Label>
          <Select
            value={selectedPatientId || '__all__'}
            onValueChange={(v) => setSelectedPatientId(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All assigned mothers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All assigned mothers</SelectItem>
              {mothers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error.message}
          <Button variant="link" className="h-auto p-0 ml-2 text-destructive" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="pl-9 h-9 text-sm" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="h-9 flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="text-xs px-3">{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading documents…
        </div>
      ) : (
        <div data-tour="documents-list" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group bg-card border border-border rounded-xl p-5 hover:shadow-[var(--shadow-hover)] hover:border-primary/20 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-1">{doc.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p>Uploaded {doc.date}</p>
                    <p>By {doc.uploadedBy}</p>
                    <p>{doc.size} · {doc.type}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 flex-1"
                  onClick={() => handleDownload(doc.id, doc.name)}
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc.id, doc.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {docs.length === 0 && (
            <div className="md:col-span-3 text-center py-12">
              <FolderOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {canUpload
                  ? 'No documents yet. Upload test results and reports for your assigned mothers.'
                  : 'No documents shared with you yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Mother</Label>
              <Select
                value={uploadForm.patientId}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, patientId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {mothers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File (max 10 MB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setUploadForm((f) => ({ ...f, file }));
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadForm.file ? uploadForm.file.name : 'Choose file…'}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
