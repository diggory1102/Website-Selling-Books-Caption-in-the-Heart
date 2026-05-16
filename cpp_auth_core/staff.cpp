#include "Staff.h"

Staff::Staff(string e) : User(e, "Staff") {}

bool Staff::canAccessAdminPanel() {
    return true;
}

string Staff::getWelcomeMessage() {
    return "Chào Nhân viên, chuyển hướng đến Trang quản lý đơn hàng.";
}