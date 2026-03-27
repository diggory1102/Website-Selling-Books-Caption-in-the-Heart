#ifndef STAFF_H
#define STAFF_H

#include "User.h"

class Staff : public User {
public:
    Staff(string e);
    bool canAccessAdminPanel() override;
    string getWelcomeMessage() override;
};

#endif