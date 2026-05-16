#include "Admin.h"

Admin::Admin(string e) : User(e, "Admin") {}

bool Admin::canAccessAdminPanel() {
    return true;
}

string Admin::getWelcomeMessage() {
    return "Chào Admin, chuyển hướng đến Bảng điều khiển Tổng.";
}