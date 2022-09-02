import React, { useCallback } from "react";

import { User as FirebaseUser } from "firebase/auth";
import { EmailAuthProvider } from "firebase/auth";
import {
    Authenticator,
    buildCollection,
    buildProperty,
    EntityReference,
    FirebaseCMSApp
} from "@camberi/firecms";

import "typeface-rubik";
import "@fontsource/ibm-plex-mono";

// TODO: Replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyC6axchnIfJDXD11QgAMRrpBhm0r2rGm08",
  authDomain: "bluesshack-6bc03.firebaseapp.com",
  projectId: "bluesshack-6bc03",
  storageBucket: "bluesshack-6bc03.appspot.com",
  messagingSenderId: "600045252144",
  appId: "1:600045252144:web:6e1fbf2f88c3c5ce56c7f5"
};

const locales = {
    "en-US": "English (United States)",
    "es-ES": "Spanish (Spain)",
    "de-DE": "German"
};

type Product = {
    name: string;
    price: number;
    status: string;
    published: boolean;
    related_products: EntityReference[];
    main_image: string;
    tags: string[];
    description: string;
    categories: string[];
    publisher: {
        name: string;
        external_id: string;
    },
    expires_on: Date
}

type User = {
    Name: string;
    Artists: EntityReference[];
}

type Artist = {
    artistName: string;
    artistImage: string;
    artistDescription: string;
    doorsOpen: string;
    entranceFee: string;
    performanceDate: string;
}

const localeCollection = buildCollection({
    path: "locale",
    customId: locales,
    name: "Locales",
    singularName: "Locales",
    properties: {
        name: {
            name: "Title",
            validation: { required: true },
            dataType: "string"
        },
        selectable: {
            name: "Selectable",
            description: "Is this locale selectable",
            dataType: "boolean"
        },
        video: {
            name: "Video",
            dataType: "string",
            validation: { required: false },
            storage: {
                storagePath: "videos",
                acceptedFiles: ["video/*"]
            }
        }
    }
});

const artistCollection = buildCollection<Artist>({
    name: 'Artists',
    singularName: 'Artist',
    path: 'Artist',
    permissions: ({ authController }) => ({
        edit: true,
        create: true,
        delete: false
    }),
    subcollections: [
        localeCollection
    ],
    properties: {
        artistDescription: {
            name: 'Artist Description',
            validation: {required: true},
            dataType: 'string'
        },
        artistName: {
            name: 'Artist Name',
            validation: { required: true },
            dataType: 'string'
        },
        artistImage: {
            name: 'Image',
            validation: { required: true },
            dataType: 'string'                    // TODO: Change to actual image?
        },
        doorsOpen: {
            name: 'Doors open at...',
            validation: { required: true },
            dataType: 'string'
        },
        entranceFee: {
            name: 'Entrance Fee',
            validation: { required: true },
            dataType: 'string'
        },
        performanceDate: {
            name: "Performance date",
            validation: { required: true },
            dataType: 'string'
        },
    }
})

const usersCollection = buildCollection<User>({
    name: "Users",
    singularName: "User",
    path: 'Users',
    permissions: ({ authController }) => ({
        edit: true,
        create: true,
        delete: false
    }),
    subcollections: [
        localeCollection
    ],
    properties: {
        Name: {
            name: "Name",
            validation: {required: true},
            dataType: "string"
        },
        Artists: {
            dataType: "array",
            name: "Favorite artists",
            description: "Reference to artists",
            of: {
                dataType: "reference",
                path: "Artist"
            }
        },
    }
})

const productsCollection = buildCollection<Product>({
    name: "Products",
    singularName: "Product",
    path: "products",
    permissions: ({ authController }) => ({
        edit: true,
        create: true,
        // we have created the roles object in the navigation builder
        delete: false
    }),
    subcollections: [
        localeCollection
    ],
    properties: {
        name: {
            name: "Name",
            validation: { required: true },
            dataType: "string"
        },
        price: {
            name: "Price",
            validation: {
                required: true,
                requiredMessage: "You must set a price between 0 and 1000",
                min: 0,
                max: 1000
            },
            description: "Price with range validation",
            dataType: "number"
        },
        status: {
            name: "Status",
            validation: { required: true },
            dataType: "string",
            description: "Should this product be visible in the website",
            longDescription: "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
            enumValues: {
                private: "Private",
                public: "Public"
            }
        },
        published: ({ values }) => buildProperty({
            name: "Published",
            dataType: "boolean",
            columnWidth: 100,
            disabled: (
                values.status === "public"
                    ? false
                    : {
                        clearOnDisabled: true,
                        disabledMessage: "Status must be public in order to enable this the published flag"
                    }
            )
        }),
        related_products: {
            dataType: "array",
            name: "Related products",
            description: "Reference to self",
            of: {
                dataType: "reference",
                path: "products"
            }
        },
        main_image: buildProperty({ // The `buildProperty` method is a utility function used for type checking
            name: "Image",
            dataType: "string",
            storage: {
                storagePath: "images",
                acceptedFiles: ["image/*"]
            }
        }),
        tags: {
            name: "Tags",
            description: "Example of generic array",
            validation: { required: true },
            dataType: "array",
            of: {
                dataType: "string"
            }
        },
        description: {
            name: "Description",
            description: "Not mandatory but it'd be awesome if you filled this up",
            longDescription: "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
            dataType: "string",
            columnWidth: 300
        },
        categories: {
            name: "Categories",
            validation: { required: true },
            dataType: "array",
            of: {
                dataType: "string",
                enumValues: {
                    electronics: "Electronics",
                    books: "Books",
                    furniture: "Furniture",
                    clothing: "Clothing",
                    food: "Food"
                }
            }
        },
        publisher: {
            name: "Publisher",
            description: "This is an example of a map property",
            dataType: "map",
            properties: {
                name: {
                    name: "Name",
                    dataType: "string"
                },
                external_id: {
                    name: "External id",
                    dataType: "string"
                }
            }
        },
        expires_on: {
            name: "Expires on",
            dataType: "date"
        }
    }
});

export default function App() {

    const myAuthenticator: Authenticator<FirebaseUser> = useCallback(async ({
                                                                    user,
                                                                    authController
                                                                }) => {

        if (user?.email?.includes("flanders")) {
            throw Error("Stupid Flanders!");
        }

        console.log("Allowing access to", user?.email);
        // This is an example of retrieving async data related to the user
        // and storing it in the user extra field.
        const sampleUserRoles = await Promise.resolve(["admin"]);
        authController.setExtra(sampleUserRoles);

        return true;
    }, []);

    return <FirebaseCMSApp
        name={"Firestore cms testing"}
        authentication={myAuthenticator}
        collections={[productsCollection, usersCollection, artistCollection]}
        firebaseConfig={firebaseConfig}
    />;
}