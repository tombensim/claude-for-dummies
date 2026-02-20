"use client";

import { Suspense } from "react";
import { RegistrationForm } from "@/components/register/RegistrationForm";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-charcoal mb-2">הרשמה לסדנה</h1>
        <p className="text-gray-warm mb-8">בחרו סדנה ומלאו את הפרטים — נשמור לכם מקום</p>
      </motion.div>
      <motion.div className="bg-white p-6 md:p-8 rounded-2xl border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Suspense fallback={<div className="py-8 text-center text-gray-warm">טוען...</div>}>
          <RegistrationForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
