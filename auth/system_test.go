package auth

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/GehirnInc/crypt"
)

func TestVerifySystemPassword(t *testing.T) {
	hasher := crypt.New(crypt.SHA512)
	hash, err := hasher.Generate([]byte("secret123"), []byte("$6$abcdefgh"))
	if err != nil {
		t.Fatalf("generate hash: %v", err)
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "shadow")
	content := "root:!::0:99999:7:::\n" +
		"ceshi:" + string(hash) + ":19000:0:99999:7:::\n" +
		"locked:!$6$abc:19000:0:99999:7:::\n" +
		"empty::19000:0:99999:7:::\n"
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write fixture: %v", err)
	}

	old := shadowPath
	shadowPath = path
	defer func() { shadowPath = old }()

	cases := []struct {
		name     string
		username string
		password string
		want     bool
	}{
		{"correct", "ceshi", "secret123", true},
		{"wrong password", "ceshi", "nope", false},
		{"unknown user", "nobody", "secret123", false},
		{"locked account", "locked", "secret123", false},
		{"empty hash", "empty", "secret123", false},
		{"injected username", "ceshi:root", "secret123", false},
		{"empty password", "ceshi", "", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := verifySystemPassword(tc.username, tc.password); got != tc.want {
				t.Fatalf("verifySystemPassword(%q, %q) = %v, want %v", tc.username, tc.password, got, tc.want)
			}
		})
	}
}

func TestVerifySystemPasswordMissingShadow(t *testing.T) {
	old := shadowPath
	shadowPath = filepath.Join(t.TempDir(), "does-not-exist")
	defer func() { shadowPath = old }()

	if verifySystemPassword("ceshi", "secret123") {
		t.Fatal("expected false when the shadow file cannot be read")
	}
}
