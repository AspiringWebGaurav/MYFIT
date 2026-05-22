import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDietStore } from "@/shared/store/useDietStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";
import { useEffect } from "react";
import { LoginCalendar } from "@/shared/components/LoginCalendar";

export function DesktopDashboard() {
  const user = useAuthStore(state => state.user);
  const diet = useDietStore(state => state.getDietForToday());
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Welcome back, {user?.displayName?.split(' ')[0] || 'Gaurav'}</h2>
        <p className="text-zinc-400 mt-1">Here&apos;s your fitness overview for today.</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-zinc-100">Today&apos;s Diet</h3>
            <span className="px-3 py-1 bg-[#10202cb5] border border-cyan-400/10 text-zinc-300 text-xs font-medium rounded-full">{diet.type}</span>
          </div>
          <div className="space-y-4">
            {diet.meals.map((meal, i) => (
              <div key={i} className="flex justify-between items-center border-b border-cyan-400/10 pb-4 last:border-0 last:pb-0">
                <span className="text-zinc-400 text-sm font-medium">{meal.meal}</span>
                <span className="text-zinc-200 text-sm">{meal.food}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-1 flex flex-col gap-6">
          <Card className="p-6 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">Gym Attendance</h3>
            <div className={`h-32 w-32 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${isAttendedToday ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' : 'bg-[#10202cb5] text-zinc-500 ring-1 ring-cyan-400/10'}`}>
              {isAttendedToday ? (
                <CheckCircle2 className="h-12 w-12" />
              ) : (
                <span className="text-sm font-medium">Pending</span>
              )}
            </div>
            <p className="text-zinc-400 text-sm">
              {isAttendedToday ? "You've crushed it today!" : "Don't forget to hit the gym."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DesktopDiet() {
  const diet = useDietStore(state => state.getDietForToday());

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Diet Plan</h2>
        <p className="text-zinc-400 mt-1">Strict adherence leads to results.</p>
      </header>

      <Card className="p-8 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyan-400/10">
          <div className="flex items-center gap-3">
            <Calendar className="text-zinc-400 h-5 w-5" />
            <h3 className="text-xl font-medium text-zinc-100">Today&apos;s Schedule</h3>
          </div>
          <span className="px-4 py-1.5 bg-zinc-100 text-zinc-900 text-sm font-semibold rounded-full">{diet.type}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {diet.meals.map((meal, i) => (
            <div key={i} className="flex flex-col gap-1 p-4 rounded-xl hover:bg-[#10202cb5] border border-transparent hover:border-cyan-400/10 transition-all">
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{meal.meal}</span>
              <span className="text-zinc-100 text-lg">{meal.food}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DesktopAttendance() {
  const user = useAuthStore(state => state.user);
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);
  const loading = useAttendanceStore(state => state.loading);
  const checkAttendanceStatus = useAttendanceStore(state => state.checkAttendanceStatus);
  const markAttendance = useAttendanceStore(state => state.markAttendance);

  useEffect(() => {
    if (user) {
      checkAttendanceStatus(user.uid);
    }
  }, [user, checkAttendanceStatus]);

  const handleMarkAttendance = () => {
    if (user && !isAttendedToday) {
      markAttendance(user.uid);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Daily Attendance</h2>
        <p className="text-zinc-400 mt-1">Consistency is the key to growth.</p>
      </header>

      <div className="flex-1 flex gap-8 items-start justify-center pb-20 mt-8">
        <Card className="w-[400px] shrink-0 p-10 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl flex flex-col items-center text-center">
          <div className={`h-40 w-40 rounded-full flex items-center justify-center mb-8 transition-all duration-700 ${isAttendedToday ? 'bg-green-500/10 text-green-400 scale-105' : 'bg-[#10202cb5] text-zinc-500 border border-cyan-400/10'}`}>
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isAttendedToday ? (
              <CheckCircle2 className="h-16 w-16" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold">0%</span>
                <span className="text-xs uppercase tracking-widest mt-1 text-zinc-500">Completed</span>
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-medium text-zinc-100 mb-2">
            {isAttendedToday ? "Workout Complete" : "Pending Session"}
          </h3>
          <p className="text-zinc-400 text-sm mb-8">
            {isAttendedToday 
              ? "Great job showing up today. Rest and recover." 
              : "Log your daily session to keep the streak alive."}
          </p>

          <Button 
            onClick={handleMarkAttendance}
            disabled={isAttendedToday || loading}
            size="lg"
            className={`w-full h-12 text-base font-medium transition-all ${
              isAttendedToday 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/20' 
                : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isAttendedToday ? 'Done for the day' : 'Mark as Complete'}
          </Button>
        </Card>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Login History
          </h3>
          <LoginCalendar />
        </div>
      </div>
    </div>
  );
}
