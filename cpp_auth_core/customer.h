#ifndef CUSTOMER_H
#define CUSTOMER_H

#include "User.h"

class Customer : public User {
public:
    Customer(string e);
    bool canAccessAdminPanel() override;
    string getWelcomeMessage() override;
};

#endif