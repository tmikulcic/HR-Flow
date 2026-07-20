import { createRouter, createWebHistory } from 'vue-router'
import AdministrationPage from '../pages/AdministrationPage.vue'
import ApprovalsPage from '../pages/ApprovalsPage.vue'
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

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage },
  { path: '/employees', name: 'employees', component: EmployeesPage },
  {
    path: '/employees/:employeeId',
    name: 'employee-detail',
    component: EmployeeDetailPage,
  },
  { path: '/time-tracking', name: 'time-tracking', component: TimeTrackingPage },
  { path: '/leave-requests', name: 'leave-requests', component: LeaveRequestsPage },
  {
    path: '/leave-requests/new',
    name: 'new-leave-request',
    component: NewLeaveRequestPage,
  },
  { path: '/team', name: 'team', component: TeamPage },
  { path: '/approvals', name: 'approvals', component: ApprovalsPage },
  { path: '/notifications', name: 'notifications', component: NotificationsPage },
  { path: '/administration', name: 'administration', component: AdministrationPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
