"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudioStore } from "@/lib/store";
import { workshops, techniqueLabels, levelLabels } from "@/lib/data";
import { CheckCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormData { name: string; phone: string; email: string; notes: string; }

export function RegistrationForm() {
  const searchParams = useSearchParams();
  const workshopIdParam = searchParams.get("workshopId");
  const [selectedId, setSelectedId] = useState(workshopIdParam || "");
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const { addRegistration, isRegistered } = useStudioStore();

  useEffect(() => { if (workshopIdParam) setSelectedId(workshopIdParam); }, [workshopIdParam]);

  const selectedWs = workshops.find((w) => w.id === selectedId);
  const alreadyRegistered = selectedId ? isRegistered(selectedId) : false;

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "נא להזין שם מלא";
    if (!form.phone.trim() || !/^0\d{8,9}$/.test(form.phone.replace(/-/g, ""))) e.phone = "נא להזין מספר טלפון תקין";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "נא להזין אימייל תקין";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!selectedWs || alreadyRegistered || !validate()) return;
    addRegistration({ workshopId: selectedWs.id, workshopName: selectedWs.name, name: form.name, phone: form.phone, email: form.email, registeredAt: new Date().toISOString() });
    setSubmitted(true);
  }

  function update(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  }

  if (submitted && selectedWs) {
    const dateStr = new Date(selectedWs.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
    return (
      <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <CheckCircle className="w-16 h-16 text-level-beginner mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-charcoal mb-2">נרשמת בהצלחה!</h3>
        <p className="text-gray-warm">{form.name}, נרשמת לסדנה <strong>{selectedWs.name}</strong> ביום {dateStr} בשעה {selectedWs.time}.</p>
        <p className="text-sm text-gray-warm mt-2">נשלח לך תזכורת למייל.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1.5">בחרו סדנה</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          <option value="">— בחרו סדנה —</option>
          {workshops.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name} | {new Date(ws.date).toLocaleDateString("he-IL")} {ws.time} | {levelLabels[ws.level]} | {ws.price} &#8362;</option>
          ))}
        </select>
      </div>

      {selectedWs && (
        <div className="bg-secondary/50 p-4 rounded-xl text-sm">
          <p className="font-bold text-charcoal">{selectedWs.name}</p>
          <p className="text-gray-warm">{techniqueLabels[selectedWs.technique]} | {selectedWs.instructor} | {selectedWs.duration} דקות</p>
          <p className="text-gray-warm mt-1">{selectedWs.spotsTotal - selectedWs.spotsTaken} מקומות פנויים | {selectedWs.price} &#8362;</p>
          {alreadyRegistered && <p className="text-level-beginner font-medium mt-2">&#10003; כבר רשום/ה לסדנה זו</p>}
        </div>
      )}

      <h3 className="text-lg font-bold text-charcoal">פרטים אישיים</h3>

      <Field label="שם מלא" error={errors.name}>
        <Input placeholder="ישראל ישראלי" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="טלפון" error={errors.phone}>
          <Input type="tel" placeholder="050-1234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" />
        </Field>
        <Field label="אימייל" error={errors.email}>
          <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} dir="ltr" />
        </Field>
      </div>
      <Field label="הערות (אופציונלי)">
        <Textarea placeholder="ניסיון קודם, בקשות מיוחדות..." value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
      </Field>

      <Button type="submit" size="lg" className="w-full gap-2" disabled={!selectedWs || alreadyRegistered}>
        <Send className="w-4 h-4" />הרשמה לסדנה
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">{label}</label>
      {children}
      <AnimatePresence>
        {error && <motion.p className="text-xs text-destructive mt-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>{error}</motion.p>}
      </AnimatePresence>
    </div>
  );
}
