"use client";

import { Settings, User, Shield } from "lucide-react";
import { useAuthStore } from "@/store";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Preferences</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings, appearance, and notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10 mt-1">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">Profile Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Update your name, email address, and role.</p>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input type="text" defaultValue={user?.name || ""} className="w-full bg-background border border-border/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input type="email" defaultValue={user?.email || ""} className="w-full bg-background border border-border/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <input type="text" disabled value={user?.role || "user"} className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2 text-sm text-muted-foreground cursor-not-allowed" />
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm flex items-start gap-4 opacity-75">
          <div className="p-3 rounded-full bg-primary/10 mt-1">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">Security & Privacy</h3>
            <p className="text-sm text-muted-foreground mb-4">Manage passwords and two-factor authentication.</p>
            <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
              Change Password
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
