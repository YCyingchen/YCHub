package auth

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/GehirnInc/crypt"
	_ "github.com/GehirnInc/crypt/sha256_crypt"
	_ "github.com/GehirnInc/crypt/sha512_crypt"

	"github.com/filebrowser/filebrowser/v2/settings"
	"github.com/filebrowser/filebrowser/v2/users"
)

// MethodSystem authenticates against the host's own UNIX accounts. It is the
// method the original FlieHub instance used: users log in with the same
// username and password they use for the NAS, and the account is looked up in
// the local shadow database instead of the application one.
const MethodSystem settings.AuthMethod = "system"

// shadowPath is a variable so tests can point it at a fixture.
var shadowPath = "/etc/shadow"

// SystemAuth is a system (shadow-based) implementation of an Auther.
type SystemAuth struct{}

// LoginPage tells that system auth requires a login page.
func (a SystemAuth) LoginPage() bool { return true }

// Auth authenticates the user against /etc/shadow and then loads the matching
// application user. Passwords are never stored by YCHub in this mode.
func (a SystemAuth) Auth(r *http.Request, usr users.Store, _ *settings.Settings, srv *settings.Server) (*users.User, error) {
	var cred jsonCred

	if r.Body == nil {
		return nil, os.ErrPermission
	}

	if err := json.NewDecoder(r.Body).Decode(&cred); err != nil {
		return nil, os.ErrPermission
	}

	if !verifySystemPassword(cred.Username, cred.Password) {
		return nil, os.ErrPermission
	}

	u, err := usr.Get(srv.Root, srv.FollowExternalSymlinks, cred.Username)
	if err != nil {
		return nil, os.ErrPermission
	}

	return u, nil
}

// verifySystemPassword checks a password against the host's shadow entry.
func verifySystemPassword(username, password string) bool {
	if username == "" || password == "" || strings.ContainsAny(username, ":\r\n") {
		return false
	}

	data, err := os.ReadFile(shadowPath)
	if err != nil {
		return false
	}

	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Split(line, ":")
		if len(fields) < 2 || fields[0] != username {
			continue
		}

		hash := strings.TrimSpace(fields[1])
		if hash == "" || hash == "*" || hash == "x" || strings.HasPrefix(hash, "!") {
			return false
		}

		crypter := crypt.NewFromHash(hash)
		if crypter == nil {
			return false
		}

		return crypter.Verify(hash, []byte(password)) == nil
	}

	return false
}
