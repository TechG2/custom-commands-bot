# Custom Commands Bot
This bot was created for an application.

# Description
This bot can create custom commands for each server, with a custom prefix, and has several moderation commands. 

## Features
### Moderation
#### Commands:
- `ban {user} {optional:time} {optional:reason}` - This command bans a user from the server.
- `unban {user}` - This command unbans a user from the server.
- `kick {user} {optional:reason}` - This command kicks a user from the server.
- `mute {user} {optional:time} {optional:reason}` - This command mutes a user from the server.
- `unmute {user}` - This command unmutes a user from the server.
- `moderation-setup {optional:mute-role} {optional:staff-role} {optional:log-channel}` - This command sets the moderation of a server.
#### Other
- `Moderation Logs` - Sends a for every moderation action(ban, unban, mute ect...).

### Custom Commands
#### Commands:
- `commands prefix {prefix}` - This command sets the server prefix.
- `commands add {command-name} {optional:embed}` - This command creates a new command.
- `commands delete {command-name}` - This command deletes a command.

## Other
### Packages
- discord.js
- dotenv
- ms
- node-schedule
- mongoose
### Other
- `DataBase` - MongoDB
- `Language` - JavaScript

## Credits
Made by:
* [TechG](https://github.com/TechG2)
