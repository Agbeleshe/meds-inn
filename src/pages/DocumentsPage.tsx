import React, { useState } from 'react';
import { DOCUMENTS } from '@/lib/demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  FileText, Upload, Search, Eye, Download, Trash2, CheckCircle2, Clock, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Document } from '@/lib/demo-data';

const CATEGORIES = ['All', 'Ultrasound', 'Lab Results', 'Discharge', 'Care Notes', 'Consent', 'Medical Records'];

export default function DocumentsPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  let docs = DOCUMENTS;
  if (category !== 'All') docs = docs.filter(d => d.category === category);
  if (search) docs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  if (sortBy === 'date') docs = [...docs].sort((a, b) => b.date.localeCompare(a.date));
  if (sortBy === 'name') docs = [...docs].sort((a, b) => a.name.localeCompare(b.name));

  const STATUS_STYLE: Record<Document['status'], string> = {
    reviewed: 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)]',
    pending: 'bg-[hsl(38_92%_90%)] text-[hsl(38_70%_28%)]',
    archived: 'bg-muted text-muted-foreground',
    signed: 'bg-[hsl(207_85%_90%)] text-[hsl(207_85%_30%)]',
  };

  return (
    <div className="space-y-6">
      <div data-tour="documents-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Amina Bello · {DOCUMENTS.length} documents</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 text-xs self-start md:self-auto" onClick={() => toast.info('Upload dialog opened')}>
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="pl-9 h-9 text-sm" />
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

      {/* Category tabs */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="h-9 flex-wrap">
          {CATEGORIES.map(c => (
            <TabsTrigger key={c} value={c} className="text-xs px-3">{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Upload dropzone */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-secondary/40 transition-colors"
        onClick={() => toast.info('File picker opened')}
      >
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG, DOCX · Max 20 MB per file</p>
        </div>
      </div>

      {/* Document grid */}
      <div data-tour="documents-list" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map(doc => (
          <div
            key={doc.id}
            className="group bg-card border border-border rounded-xl p-5 hover:shadow-[var(--shadow-hover)] hover:border-primary/20 transition-all cursor-pointer"
            onClick={() => setPreviewDoc(doc)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-1">{doc.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', STATUS_STYLE[doc.status])}>
                    {doc.status === 'reviewed' ? 'Reviewed' : doc.status === 'pending' ? 'Pending' : 'Archived'}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  <p>Uploaded {doc.date}</p>
                  <p>By {doc.uploadedBy}</p>
                  <p>{doc.size} · {doc.type}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={e => { e.stopPropagation(); setPreviewDoc(doc); }}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={e => { e.stopPropagation(); toast.success(`Downloading ${doc.name}…`); }}>
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="md:col-span-3 text-center py-12">
            <FolderOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No documents in this category.</p>
          </div>
        )}
      </div>

      {/* Preview sheet */}
      <Sheet open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <SheetContent side="right" className="w-full max-w-[calc(100%-2rem)] md:max-w-lg">
          {previewDoc && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm font-semibold truncate">{previewDoc.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="w-full aspect-[4/5] bg-muted rounded-lg flex flex-col items-center justify-center gap-3">
                  <FileText className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{previewDoc.type} document</p>
                  <p className="text-xs text-muted-foreground/60">Preview not available in demo</p>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Category', value: previewDoc.category },
                    { label: 'Uploaded', value: previewDoc.date },
                    { label: 'Uploaded by', value: previewDoc.uploadedBy },
                    { label: 'File size', value: previewDoc.size },
                    { label: 'Status', value: previewDoc.status },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground capitalize">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-1.5 text-sm" onClick={() => toast.success(`Downloading ${previewDoc.name}…`)}>
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5 text-sm" onClick={() => toast.info('Document shared with care team')}>
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
