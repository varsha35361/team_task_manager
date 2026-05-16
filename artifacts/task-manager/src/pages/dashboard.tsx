import { useGetDashboardSummary, useGetActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, CircleDashed, Clock, FileText, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: loadingActivity } = useGetActivity({ limit: 10 });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your team's current status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalTasks || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{summary?.overdueCount || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <CircleDashed className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{summary?.byStatus.in_progress || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">{summary?.byStatus.done || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Tasks organized by urgency.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2 text-destructive"><div className="w-2 h-2 rounded-full bg-destructive" /> Urgent</span>
                  <span className="text-sm font-bold">{summary?.byPriority.urgent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2 text-orange-500"><div className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                  <span className="text-sm font-bold">{summary?.byPriority.high || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2 text-yellow-500"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Medium</span>
                  <span className="text-sm font-bold">{summary?.byPriority.medium || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400" /> Low</span>
                  <span className="text-sm font-bold">{summary?.byPriority.low || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p>
                        <span className="font-semibold">{activity.memberName || 'Someone'}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {activity.type.replace('_', ' ')}
                        </span>
                        {' '}
                        <span className="font-medium text-foreground">"{activity.taskTitle}"</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
