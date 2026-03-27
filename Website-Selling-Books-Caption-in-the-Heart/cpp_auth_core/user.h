#ifndef USER_H
#define USER_H

#include <string>
using namespace std;

class User {
protected:
    string email;
    string roleName;

public:
    User(string e, string r);
    virtual ~User(); // PHẢI CÓ TỪ KHÓA virtual Ở ĐÂY
    
    virtual bool canAccessAdminPanel() = 0;
    virtual string getWelcomeMessage() = 0;
};

#endif