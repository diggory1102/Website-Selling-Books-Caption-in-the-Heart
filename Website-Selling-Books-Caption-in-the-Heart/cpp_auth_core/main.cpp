#include <iostream>
#include <string>
#include "Admin.h"
#include "Staff.h"
#include "Customer.h"

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 3) {
        cout << "{\"success\": false, \"message\": \"Thieu tham so tu Node.js!\"}" << endl;
        return 1;
    }

    string email = argv[1];
    string roleStr = argv[2]; 

    User* currentUser = nullptr;

    if (roleStr == "admin") {
        currentUser = new Admin(email);
    } else if (roleStr == "staff") {
        currentUser = new Staff(email);
    } else {
        currentUser = new Customer(email);
    }

    if (currentUser->canAccessAdminPanel()) {
        cout << "{\"success\": true, \"role\": \"" << roleStr << "\", \"message\": \"" << currentUser->getWelcomeMessage() << "\"}" << endl;
    } else {
        cout << "{\"success\": false, \"role\": \"" << roleStr << "\", \"message\": \"" << currentUser->getWelcomeMessage() << "\"}" << endl;
    }

    delete currentUser; 
    return 0;
}