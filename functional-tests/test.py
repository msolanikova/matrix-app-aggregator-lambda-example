import argparse
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--success", required=False, default="True", dest="success",
                        help="Should this test succeed?")
    args = parser.parse_args()
    success = args.success.lower() == 'true'

    print("Test 1 - OK")
    print("Test 2 - OK")
    print("Test 3 - " + ("OK" if success else "Failed"))
    sys.exit(0) if success else sys.exit(1)

if __name__ == '__main__':
    main()
