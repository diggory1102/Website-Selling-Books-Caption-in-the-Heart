#include "Customer.h"

Customer::Customer(string e) : User(e, "Customer") {}

bool Customer::canAccessAdminPanel() {
    return false;
}

string Customer::getWelcomeMessage() {
    return "Chào khách hàng, bạn không có quyền truy cập trang quản trị!";
}