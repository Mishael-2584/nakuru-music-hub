import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MessageSquare, BookOpen, Clock, Bell, UserCircle, BadgeCheck, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading, signOut } = useAuth();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsTeacher(false);
        setIsApproved(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        // Get teacher profile
        const { data: teacherProfile, error: teacherError } = await supabase
          .from("teachers")
          .select("*, category, experience, bio, status, approval_status")
          .eq("email", user.email)
          .single();
        if (teacherProfile && !teacherError && teacherProfile.status === "active") {
          setIsTeacher(true);
          setIsApproved(true);
          setProfile(teacherProfile);
        } else {
          // Check if user is a pending teacher
          const { data: pendingTeacher, error: pendingTeacherError } = await supabase
            .from("pending_teachers")
            .select("id")
            .eq("email", user.email)
            .single();
          if (pendingTeacher && !pendingTeacherError) {
            setIsTeacher(false);
            setIsApproved(false);
            navigate("/pending-teacher", { replace: true });
            return;
          }
          // User is not a teacher, check their actual role and redirect
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile && !profileError && profile.role === 'admin') {
            navigate("/admin", { replace: true });
          } else {
            navigate("/student", { replace: true });
          }
        }
      } catch (error) {
        setIsTeacher(false);
        setIsApproved(false);
        navigate("/student", { replace: true });
      } finally {
        setChecking(false);
      }
    };
    checkUserRole();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-lg text-muted-foreground">Checking account status...</div>
      </div>
    );
  }
  if (!isTeacher || !isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-lg text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f6ff] via-[#f9f7fd] to-[#f6f8ff] py-0 px-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pt-10 pb-20 px-2 md:px-8">
        {/* Sidebar/Profile */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="group">
              <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-12 w-12 rounded-lg shadow bg-white p-1 transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">Teacher Portal</h1>
              <div className="flex items-center gap-2 mt-1">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Active</span>
              </div>
            </div>
          </div>
          <Card className="shadow-lg border-0 bg-white/95 p-0">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <UserCircle className="h-9 w-9 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold leading-tight">{profile?.teacher_name || user.email}</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-500">{profile?.category}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="text-sm text-gray-700 mb-2">{profile?.bio}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">Experience: {profile?.experience || 'N/A'}</span>
                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs font-medium">Category: {profile?.category || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col gap-8">
          {/* Top Bar: Welcome + Sign Out */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex flex-col gap-1">
              <span className="text-base text-muted-foreground font-medium">Welcome,</span>
              <span className="text-2xl font-bold text-gray-900">{profile?.teacher_name || user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Active</span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 ml-4"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="w-full flex justify-center mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-3xl">
              <TabsList className="w-full flex justify-between bg-white/90 shadow rounded-full p-1">
                <TabsTrigger value="dashboard" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md transition-all">
                  <Bell className="w-5 h-5" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-accent data-[state=active]:bg-accent/10 data-[state=active]:shadow-md transition-all">
                  <Calendar className="w-5 h-5" />
                  <span>Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:shadow-md transition-all">
                  <Users className="w-5 h-5" />
                  <span>Students</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-pink-600 data-[state=active]:bg-pink-100 data-[state=active]:shadow-md transition-all">
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all">
                  <BookOpen className="w-5 h-5" />
                  <span>Resources</span>
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:shadow-md transition-all">
                  <Clock className="w-5 h-5" />
                  <span>Availability</span>
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Dashboard</CardTitle>
                    <CardDescription>Overview of your upcoming lessons and notifications.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Upcoming lessons and notifications will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Teaching Schedule</CardTitle>
                    <CardDescription>Manage your available time slots and view bookings.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Time slot management and bookings will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Student Management</CardTitle>
                    <CardDescription>Mark attendance, add lesson notes, upload resources, view progress.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Student management features will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Messages</CardTitle>
                    <CardDescription>Communicate securely with students, parents, and admin.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Messaging features will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Academy Resources</CardTitle>
                    <CardDescription>Access internal documents and policies.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Academy resources and policies will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="mt-8">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Availability & Time Off</CardTitle>
                    <CardDescription>Request time off or update your availability.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">Availability and time-off management will appear here.</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TeacherDashboard; 