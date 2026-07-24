import { createRouter, createWebHistory } from 'vue-router'
import AdministrationPage from '../pages/AdministrationPage.vue'
import ApprovalsPage from '../pages/ApprovalsPage.vue'
import AppLayout from '../layouts/AppLayout.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import EmployeeDetailPage from '../pages/EmployeeDetailPage.vue'
import EmployeesPage from '../pages/EmployeesPage.vue'
import LeaveRequestsPage from '../pages/LeaveRequestsPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import NewLeaveRequestPage from '../pages/NewLeaveRequestPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import NotificationsPage from '../pages/NotificationsPage.vue'
import TeamPage from '../pages/TeamPage.vue'
import TimeTrackingPage from '../pages/TimeTrackingPage.vue'
import UiPreviewPage from '../pages/UiPreviewPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardPage,
        meta: { title: 'Dashboard', subtitle: 'Northstar Labs' },
      },
      {
        path: 'employees',
        name: 'employees',
        component: EmployeesPage,
        meta: { title: 'Employees', subtitle: 'People directory and employee records' },
      },
      {
        path: 'employees/:employeeId',
        name: 'employee-detail',
        component: EmployeeDetailPage,
        meta: { title: 'Employee profile', subtitle: 'Employee details and activity' },
      },
      {
        path: 'time-tracking',
        name: 'time-tracking',
        component: TimeTrackingPage,
        meta: { title: 'Time tracking', subtitle: 'Your weekly work records' },
      },
      {
        path: 'leave-requests',
        name: 'leave-requests',
        component: LeaveRequestsPage,
        meta: { title: 'My leave', subtitle: 'Balance, requests and upcoming time off' },
      },
      {
        path: 'leave-requests/new',
        name: 'new-leave-request',
        component: NewLeaveRequestPage,
        meta: { title: 'New leave request', subtitle: 'Request time off' },
      },
      {
        path: 'team',
        name: 'team',
        component: TeamPage,
        meta: { title: 'My team', subtitle: 'Engineering team overview' },
      },
      {
        path: 'approvals',
        name: 'approvals',
        component: ApprovalsPage,
        meta: { title: 'Approvals', subtitle: 'Review team leave requests' },
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: NotificationsPage,
        meta: { title: 'Notifications', subtitle: 'Updates that need your attention' },
      },
      {
        path: 'administration',
        name: 'administration',
        component: AdministrationPage,
        meta: { title: 'Administration', subtitle: 'Users, roles and company settings' },
      },
    ],
  },
  { path: '/ui-preview', name: 'ui-preview', component: UiPreviewPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · HR-Flow` : 'HR-Flow'
})

export default router
